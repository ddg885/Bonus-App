# DATA DICTIONARY

## Input Domains
- **Execution / Approval Data**: `dodid`, `typeCode`, `effectiveDate`, `installmentAmount`, `installments`, `paygrade`, `uic`, `status`
- **Bonus Info**: `budgetLineItem`, `category`, `oe`, `bonusType`, `tier`, `amount`, `payout`, `term`, `installments`, `initialPaymentPct`, `anniversaryPaymentPct`
- **Target Average Initial Bonus**: `category`, `FY####` columns
- **Controls / Budget**: `budgetLineItem`, `category`, `oe`, `bonusType`, `FY####` columns
- **Aggregate Initial Takers**: `category`, `FY####` columns
- **Crosswalk**: `id`, `matchField`, `matchValue`, `category`, `budgetLineItem`, `oe`, `bonusType`, `priority`

## Output Domains
- **Payout Schedule**: includes payout type/date/FY, obligation FY, amount, and source trace.
- **Projected Distribution**: category-year-bonus allocation with takers and variance from target average.
- **Budget Variance**: projected vs control by category/FY and status flag.
