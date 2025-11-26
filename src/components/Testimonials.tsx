import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Generate initials from a name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

// Generate a color based on initials (similar to Google profile pics)
const getAvatarColor = (initials: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-cyan-500',
    'bg-amber-500',
  ];
  
  // Use initials to consistently pick a color
  const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return colors[hash % colors.length];
};

const reviews = [
  {
    name: "Daniel Nahmias",
    role: "Google Review",
    text: "After completing an incredible week of coaching with Cory and Conscious Counsel, I truly feel unstoppable.",
    date: "28 Nov, 2024",
  },
  {
    name: "Hoala Wellness Consulting",
    role: "Google Review",
    text: "Working with the team was a great experience. It has translated to greater confidence and security for me in my coaching practice.",
    date: "15 Oct, 2024",
  },
  {
    name: "Connor Daly",
    role: "Google Review",
    text: "Quickly provided the documents I needed to protect my growing business. They communicated clearly and made the legal language easy to understand.",
    date: "8 Jan, 2025",
  },
  {
    name: "Parnita",
    role: "Google Review",
    text: "The first word that comes to mind is WOW! One of the best decisions I have ever made. They made everything clear, supportive, and easy.",
    date: "22 Dec, 2024",
  },
  {
    name: "Philippe Kirouac",
    role: "Google Review",
    text: "The team were so easy to work with. Thank you Cory and team for truly leading with your heart and helping me solve all my legal issues.",
    date: "5 Sep, 2024",
  },
  {
    name: "Muskoka Mermaid",
    role: "Google Review",
    text: "I needed a legal document turned around quickly. Cory and his team connected with me right away to make sure they fully understood what I needed.",
    date: "19 Nov, 2024",
  },
  {
    name: "Virginia Martin",
    role: "Google Review",
    text: "I appreciate the attentiveness of the entire Conscious Council team. Each business is unique, and having their prompt and specialized attention to my specific priorities and concerns is very reassuring.",
    date: "12 Aug, 2024",
  },
  {
    name: "Amy de Sa",
    role: "Google Review",
    text: "Cory and his team at Conscious Counsel were great to work with! They provided excellent service and products for my business, were attentive, detail oriented and responded quickly to correspondences.",
    date: "3 Feb, 2025",
  },
  {
    name: "Shannon Barbaro",
    role: "Google Review",
    text: "⭐️⭐️⭐️⭐️⭐️ Highly Recommend Conscious Counsel. As a Pilates studio owner, finding legal support that truly understands the wellness world made a huge difference.",
    date: "17 Oct, 2024",
  },
  {
    name: "Sylvain Tremblay",
    role: "Google Review",
    text: "Cory Sterling and his team have been an invaluable part of our journey to legally protect our business.",
    date: "29 Jul, 2024",
  },
  {
    name: "Julie",
    role: "Google Review",
    text: "As a yoga teacher and small business owner, I wanted to be sure my updated legal documents were right. Conscious Counsel helped me get everything in place so I could focus on helping my clients.",
    date: "14 Jan, 2025",
  },
  {
    name: "Becky Keen",
    role: "Google Review",
    text: "I searched for a lawyer I'd feel super comfortable with and am so happy I found Cory. He was easy to talk to, worked quickly, paid attention to detail, and took a load off my plate by writing all my contracts. Is it possible to love your lawyer? With Cory it is!",
    date: "6 Dec, 2024",
  },
  {
    name: "Klara Sarkanyova",
    role: "Google Review",
    text: "I participated in the Camp Conscious Counsel coaching retreat and it was a fantastic experience. Cory is incredibly knowledgeable and encouraging.",
    date: "24 Sep, 2024",
  },
  {
    name: "Michelle Li",
    role: "Google Review",
    text: "Really big thanks to Cory and the Conscious Counsel Team. They helped protect my business. I love their service, and hope their professionalism helps more companies in the fitness industry.",
    date: "11 Nov, 2024",
  },
  {
    name: "Alvin Johnson",
    role: "Google Review",
    text: "Working with Conscious Counsel has been an absolute pleasure. Tracy was incredibly patient and guided me step-by-step through this legal journey.",
    date: "31 Aug, 2024",
  },
  {
    name: "Chirag Challa",
    role: "Google Review",
    text: "Working with this team was seamless from start to finish. They kept us informed throughout the process and made something typically difficult feel smooth.",
    date: "9 Jan, 2025",
  },
  {
    name: "Katie Branter",
    role: "Google Review",
    text: "Cory and his crew are the most conscious group I've ever worked with in the legal profession. Heart-centered, loving, quick, and efficient.",
    date: "20 Oct, 2024",
  },
  {
    name: "Calli Rothberg",
    role: "Google Review",
    text: "The team at Conscious Counsel is top-notch! They helped me with multiple legal documents I use daily and made me feel professional, secure, and at ease.",
    date: "7 Sep, 2024",
  },
  {
    name: "Marty Mielke",
    role: "Google Review",
    text: "Cory's Big Love manner immediately helped me believe law could be user-friendly. He quickly understood our unusual vision.",
    date: "16 Dec, 2024",
  },
  {
    name: "Kim Foster, M.D.",
    role: "Google Review",
    text: "Cory and his team have been invaluable as I grow my business. I feel supported and confident I'm getting excellent legal advice specific to the wellness sector.",
    date: "2 Feb, 2025",
  },
  {
    name: "Julie Iannarone",
    role: "Google Review",
    text: "Everything has been easy and straightforward, even as a first-time business owner. The team helped work through every step.",
    date: "25 Nov, 2024",
  },
  {
    name: "Brian Sipotz",
    role: "Google Review",
    text: "In 12 years of owning my gym, I never had proper legal documents. Conscious Counsel made law fun and helped me finally get protected.",
    date: "13 Aug, 2024",
  },
  {
    name: "Tami Tomlinson",
    role: "Google Review",
    text: "A huge thank you to Cory and his team! They expertly guided me through filing a trademark and preparing essential legal documents to protect me and my business.",
    date: "4 Jan, 2025",
  },
  {
    name: "A Florez C",
    role: "Google Review",
    text: "I'm grateful to Cory and the whole team. They provided personalized, easily understandable legal services and truly practice what they preach.",
    date: "18 Oct, 2024",
  },
  {
    name: "Lovell Kosh",
    role: "Google Review",
    text: "Cory is a lawyer with a heart. He supported us while setting up our business documents and has been extremely helpful.",
    date: "30 Jul, 2024",
  },
  {
    name: "Aleana Yu",
    role: "Google Review",
    text: "Conscious Counsel has been an amazing asset to my business. They made contracts, waivers, and legal questions transparent and empowering.",
    date: "21 Sep, 2024",
  },
  {
    name: "Rachelle Punski",
    role: "Google Review",
    text: "Cory has helped me tremendously with my personal training business. He's provided mindset support and essential tools to grow.",
    date: "10 Dec, 2024",
  },
  {
    name: "Gabriella Klimaszewski",
    role: "Google Review",
    text: "Cory reviewed a complex contract and made it easy and light. He continues to support me with invaluable knowledge.",
    date: "26 Nov, 2024",
  },
  {
    name: "Daniel Nahmias",
    role: "Google Review",
    text: "Cory and his team are real change makers! Working with them was a pleasure and led to many breakthroughs.",
    date: "1 Feb, 2025",
  },
  {
    name: "Diane Lynch",
    role: "Google Review",
    text: "I had a time-sensitive legal issue come out of nowhere and Conscious Counsel responded quickly and helped immediately.",
    date: "23 Oct, 2024",
  },
  {
    name: "Emily Fulcher",
    role: "Google Review",
    text: "Cory was exactly what I needed as a new fitness business owner. He understood my background and helped set up all the legal documents.",
    date: "27 Aug, 2024",
  },
  {
    name: "Kevin Vandi",
    role: "Google Review",
    text: "Working with Cory has been a breath of fresh air. He took the time to understand me, my goals, and made the process easy.",
    date: "6 Jan, 2025",
  },
  {
    name: "Kerri Jackson",
    role: "Google Review",
    text: "The team was responsive, engaging, and pleasant to deal with. My company was incorporated in a couple of days.",
    date: "19 Sep, 2024",
  },
  {
    name: "Allison Kares",
    role: "Google Review",
    text: "I'm so grateful for Cory. I wish I'd met him years ago—he could've saved me a lot of headaches with employee agreements.",
    date: "11 Nov, 2024",
  },
  {
    name: "Kristen Sharp",
    role: "Google Review",
    text: "Cory and his team are one of a kind. They translate complex legal topics into simple language and make the process enjoyable.",
    date: "15 Dec, 2024",
  },
  {
    name: "Amanda McKinney",
    role: "Google Review",
    text: "Working with Conscious Counsel was fun and easy. The whole process was wonderful and stress-free.",
    date: "8 Feb, 2025",
  },
  {
    name: "Hannah Parikh",
    role: "Google Review",
    text: "I absolutely loved working with Cory and the team. My questions were answered quickly and I felt supported.",
    date: "4 Oct, 2024",
  },
  {
    name: "Lucy St. John",
    role: "Google Review",
    text: "Great process—effortless. Cory was there every step of the way. Highly recommend.",
    date: "29 Nov, 2024",
  },
  {
    name: "Rosemary Barrow",
    role: "Google Review",
    text: "If you're in the health & fitness industry and want the best legal professionals, Conscious Counsel is the team.",
    date: "17 Jan, 2025",
  },
  {
    name: "Danielle Cook",
    role: "Google Review",
    text: "I've had a vision for my business for a decade. Working with Cory and his team feels perfect—they've supported me every step.",
    date: "22 Sep, 2024",
  },
  {
    name: "Paul Buono",
    role: "Google Review",
    text: "Knowledgeable, responsive, and helpful in every way. I never imagined legal help could be this professional and supportive.",
    date: "13 Dec, 2024",
  },
  {
    name: "Kim Scarrow",
    role: "Google Review",
    text: "The team was responsive and helped us draft our LOI quickly and collaboratively.",
    date: "5 Feb, 2025",
  },
  {
    name: "Taylor Lyons",
    role: "Google Review",
    text: "Cory and his team are AMAZING! I emailed him late on a Friday night and he responded in three minutes and hopped on a call.",
    date: "30 Dec, 2024",
  },
  {
    name: "Leslie McKee",
    role: "Google Review",
    text: "I've worked with this team multiple times. Stress-free, easy, and my documents are clear, robust, and even fun to read.",
    date: "14 Oct, 2024",
  },
  {
    name: "Kate Gregory",
    role: "Google Review",
    text: "I'm so happy I signed up. They took a huge load off my shoulders and made everything easy for my coaching practice.",
    date: "20 Jan, 2025",
  },
  {
    name: "Jordana Saks",
    role: "Google Review",
    text: "Cory made law FUN!!! The entire process was stress-free, approachable, and collaborative.",
    date: "7 Nov, 2024",
  },
];

const Testimonials: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const initialCount = 6;
  const displayedReviews = showAll ? reviews : reviews.slice(0, initialCount);

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 whitespace-nowrap">
            OVER 500 GYM OWNERS LOVE US
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="flex text-amber-400">
               {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-6 h-6" />)}
             </div>
             <span className="font-bold text-slate-700">455 5-star reviews</span>
          </div>
          <p className="text-slate-600">
            We have over 455 5-star Google reviews from satisfied gym owners who have protected their businesses with our legal documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReviews.map((review, index) => {
            const initials = getInitials(review.name);
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(initials)} text-white font-semibold flex items-center justify-center text-base shadow-sm`}>
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{review.name}</h4>
                      <p className="text-slate-500 text-xs">{review.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex text-amber-400 mb-3">
                   {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-3 h-3" />)}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                  "{review.text}"
                </p>
                
                <div className="mt-4 text-xs text-slate-400">
                  {review.date}
                </div>
              </div>
            );
          })}
        </div>
        
        {reviews.length > initialCount && (
          <div className="text-center mt-12">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-8 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              {showAll ? 'Show Less Reviews' : 'Read More Reviews'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;

