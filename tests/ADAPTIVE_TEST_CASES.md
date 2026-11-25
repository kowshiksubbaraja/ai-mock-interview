

**# Adaptive Interview Test Cases**



**## Objective**

**Verify that the interview system adjusts question difficulty based on the candidate's previous answer evaluation score.**



**## Difficulty Adjustment Rules**



**| Previous Overall Score | Next Question Difficulty |**

**|---|---|**

**| 80–100 | HARD |**

**| 50–79 | MEDIUM |**

**| 0–49 | EASY |**



**## Test Cases**



**| Test Case | Previous Score | Expected Difficulty | Result |**

**|---|---:|---|---|**

**| TC01 | 90 | HARD | Pass |**

**| TC02 | 80 | HARD | Pass |**

**| TC03 | 79 | MEDIUM | Pass |**

**| TC04 | 65 | MEDIUM | Pass |**

**| TC05 | 50 | MEDIUM | Pass |**

**| TC06 | 49 | EASY | Pass |**

**| TC07 | 30 | EASY | Pass |**



**## Integration Test**



**1. Create a new interview session with MEDIUM difficulty.**

**2. Generate the first question using Gemini.**

**3. Submit an answer and receive an AI evaluation.**

**4. The first answer received an overall score of 87.**

**5. Request the next question.**

**6. Verify that the next question difficulty changes to HARD.**



**\*\*Observed Result:\*\* MEDIUM → HARD**



**\*\*Status:\*\* Passed.**



**## Conclusion**



**The adaptive difficulty mechanism successfully uses previous answer evaluation scores to select the difficulty of subsequent interview questions.**
