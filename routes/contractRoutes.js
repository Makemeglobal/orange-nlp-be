const express = require("express");
const Contract = require("../model/contract");
const { authMiddleware } = require("../middleware/auth");
const { createContract, getAllContracts, addTimeline, getTimeline, addPaymentMilestone, getPaymentMilestones, updateMilestoneStatus, getVersionsByContract,getContractById } = require("../controller/contract.controller");

const router = express.Router();
router.post('/',authMiddleware,createContract);
router.get('/',authMiddleware,getAllContracts)
router.get('/:id',authMiddleware,getContractById)
router.put('/:contractId/timeline',authMiddleware,addTimeline)
router.get('/:contractId/timeline',authMiddleware,getTimeline)
router.put('/:contractId/payment-milestone',authMiddleware,addPaymentMilestone)
router.get('/:contractId/payment-milestone',authMiddleware,getPaymentMilestones)
router.put("/:contractId/milestones/:milestoneId/status", updateMilestoneStatus);
router.get('/:contractId/versions',getVersionsByContract);
// Update contract description and manage versions
router.put("/update-version/:id", async (req, res) => {
    try {
        const { contractDesc } = req.body;
        const contractId = req.params.id;

        if (!contractDesc) {
            return res.status(400).json({ message: "Contract description is required." });
        }

        // Fetch the contract
        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found." });
        }

        // Determine new version number
        const latestVersion = contract.version.length > 0 
            ? contract.version[contract.version.length - 1].version + 1 
            : 1;

        // Add new version to the beginning (to maintain latest first)
        contract.version.push({ version: latestVersion, contractDesc });

        // Keep only the latest 5 versions
        if (contract.version.length > 5) {
            contract.version = contract.version.slice(-5); // Keep last 5 versions
        }

        // Update last modified date
        contract.lastUpdate = new Date();

        // Save contract
        await contract.save();

        res.status(200).json({ message: "Contract updated successfully.", contract });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


router.get("/contract-versions/:id", async (req, res) => {
    try {
        const contractId = req.params.id;

        // Fetch contract
        const contract = await Contract.findById(contractId).select("version");
     
        // Return versions (already limited to 5 from the update API)
        res.status(200).json({ versions: contract.version });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

module.exports = router;
