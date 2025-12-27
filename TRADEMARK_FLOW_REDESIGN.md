# Trademark Scan Flow - Redesign Documentation

## Old Flow
1. Intro screen
2. 13 quiz questions
3. Calculating screen
4. Results screen
5. Enter website/business name
6. Generate PDF

## New Improved Flow

### Step 1: Business Name Input (FIRST STEP)
- Clean, simple input asking for business name
- Big, clear CTA: "Check Trademark Availability"
- Subtitle: "We'll instantly search the USPTO database"

### Step 2: USPTO Search & Instant Results
- Loading animation while searching USPTO database
- Show immediate results:
  - ✅ **LOW RISK**: No exact matches found
  - ⚡ **MODERATE RISK**: Similar marks found
  - ⚠️ **HIGH RISK**: Exact or very similar marks found

- Display:
  - Number of similar marks found
  - Top conflicting trademarks (if any)
  - Initial recommendation

### Step 3: Deeper Analysis Option
- "Want a comprehensive trademark risk assessment?"
- Two buttons:
  - "Get My Report Now" - Skip to final PDF with USPTO results only
  - "Get Full Analysis" - Continue to 13 questions for deeper insights

### Step 4-16: Optional Deep Dive Questions (IF user wants full analysis)
- Same 13 questions as before
- But now they're OPTIONAL
- User can skip at any time and generate report

### Step Final: Comprehensive Report
- Combines USPTO search results + quiz answers (if completed)
- Generates PDF with:
  - USPTO trademark conflicts found
  - Trademark availability status
  - Risk assessment score
  - Detailed recommendations
  - Next steps with call-to-action

## Key Improvements

1. **Immediate Value**: USPTO search happens first, users get instant feedback
2. **Respect User Time**: They can get basic report immediately or go deeper
3. **Better Flow**: No more filling out 13 questions before knowing if name is even available
4. **More Actionable**: USPTO results give concrete "this name is/isn't available" info
5. **Flexible**: Power users can get deep analysis, casual users get quick answers

## Technical Implementation

### New States
- `business-name-input` - Initial step
- `uspto-searching` - Loading state while API calls USPTO
- `uspto-results` - Show search results
- `analysis-choice` - Ask if they want deeper analysis
- `quiz` - Optional 13 questions (existing)
- `final-report` - Generate comprehensive PDF

### API Calls
1. `/api/trademarks/uspto-search` - New endpoint for instant trademark check
2. `/api/trademarks/request` - Existing endpoint, enhanced with USPTO data

### Data Flow
```typescript
interface TrademarkAnalysis {
  businessName: string;
  usptoResults: {
    found: boolean;
    totalResults: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    recommendation: string;
    trademarks: TrademarkSearchResult[];
  };
  quizData?: {
    answers: number[];
    answerDetails: any[];
    score: number;
    riskLevel: string;
  };
}
```
