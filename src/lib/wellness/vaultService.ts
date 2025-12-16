import { supabase } from '../supabase';
import { UserDocument } from '../../types/wellness';

export const vaultService = {
    /**
     * Fetch all documents for the current user
     */
    async getUserDocuments(): Promise<UserDocument[]> {
        if (!supabase) return [];

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            return [];
        }

        return data as UserDocument[];
    },

    /**
     * Upload a new document
     */
    async uploadDocument(
        file: File,
        category: UserDocument['category'],
        title?: string,
        description?: string,
        analysis?: string,
        documentType?: string
    ): Promise<UserDocument | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // 1. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from('wellness-documents')
            .upload(filePath, file);

        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

        // 2. Create DB Record
        const docTitle = title || file.name;
        const docData: any = {
            user_id: user.id,
            title: docTitle,
            description,
            analysis, // Add analysis here
            file_path: filePath,
            file_type: fileExt,
            category,
            created_at: new Date().toISOString()
        };

        // Add document_type if provided
        if (documentType) {
            docData.document_type = documentType;
        }

        const { data: dbData, error: dbError } = await supabase
            .from('user_documents')
            .insert([docData])
            .select()
            .single();

        if (dbError) throw new Error(`Database Error: ${dbError.message}`);

        return dbData as UserDocument;
    },

    /**
     * Get a temporary download URL for a document
     */
    async getDownloadUrl(filePath: string): Promise<string | null> {
        if (!supabase) return null;

        const { data, error } = await supabase.storage
            .from('wellness-documents')
            .createSignedUrl(filePath, 60 * 60); // Valid for 1 hour

        if (error) {
            console.error('Error creating signed URL:', error);
            return null;
        }

        return data.signedUrl;
    },

    /**
     * Update a document's analysis
     */
    async updateDocumentAnalysis(id: string, analysis: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            const { error } = await supabase
                .from('user_documents')
                .update({ analysis })
                .eq('id', id);

            if (error) {
                console.error('Error updating document analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error updating document analysis:', error);
            return false;
        }
    },

    /**
     * Delete a document
     */
    async deleteDocument(id: string, filePath: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            // 1. Delete DB Record (RLS ensures user owns it)
            const { error: dbError } = await supabase
                .from('user_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('wellness-documents')
                .remove([filePath]);

            if (storageError) console.error('Warning: Failed to delete file from storage', storageError);

            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            return false;
        }
    }
};
