const express = require("express");
const Contract = require("../model/contract");
const { authMiddleware } = require("../middleware/auth");
const { createContract, getAllContracts, addTimeline, getTimeline, addPaymentMilestone, getPaymentMilestones } = require("../controller/contract.controller");

const router = express.Router();
router.post('/',authMiddleware,createContract);
router.get('/',authMiddleware,getAllContracts)
router.put('/:contractId/timeline',authMiddleware,addTimeline)
router.get('/:contractId/timeline',authMiddleware,getTimeline)
router.put('/:contractId/payment-milestone',authMiddleware,addPaymentMilestone)
router.get('/:contractId/payment-milestone',authMiddleware,getPaymentMilestones)

module.exports = router;
