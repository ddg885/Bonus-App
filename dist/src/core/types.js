/**
 * @typedef {Record<string, string | number | null>} RawUploadRow
 * @typedef {{id:string,budgetLineItem:string,category:string,oe:string,bonusType:string,tier:string,amount:number,payout:string,term:number,installments:number,initialPaymentPct:number,anniversaryPaymentPct:number,sourceRef?:string}} BonusInfoRecord
 * @typedef {{category:string,targetsByFy:Record<string,number>,sourceRef?:string}} TargetAverageRecord
 * @typedef {{budgetLineItem:string,category:string,oe:string,bonusType:string,controlsByFy:Record<string,number>,sourceRef?:string}} ControlRecord
 * @typedef {{category:string,takersByFy:Record<string,number>,sourceRef?:string}} AggregateTakersRecord
 * @typedef {{id:string,matchField:string,matchValue:string,category:string,budgetLineItem:string,oe:string,bonusType:string,priority:number}} CrosswalkRule
 * @typedef {{sourceId:string,dodid:string,rawTypeCode:string,effectiveDate:string,status:string,baseAmount:number,installments:number,installmentNumber:number,installmentDate:string,paygrade:string,uic:string}} NormalizedBonusRecord
 * @typedef {{id:string,sourceId:string,category:string,budgetLineItem:string,oe:string,bonusType:string,payoutType:'INITIAL'|'ANNIVERSARY',payoutDate:string,payoutFy:string,obligationFy:string,amount:number,installmentNumber:number,installmentSequence:number,trace:{sourceRowId:string,ruleId?:string}}} PayoutScheduleRecord
 * @typedef {{category:string,fiscalYear:string,bonusRecordId:string,takers:number,initialPayoutTotal:number,anniversaryPayoutTotal:number,avgInitialPayout:number,targetAverage:number,targetVariance:number,sourceRef:string}} ProjectedDistributionRecord
 * @typedef {{budgetLineItem:string,category:string,oe:string,bonusType:string,fiscalYear:string,projectedAmount:number,controlAmount:number,variance:number,status:'OVER'|'UNDER'|'ON_PLAN'}} BudgetVarianceRecord
 */
export const __types = {};
