const express = require("express");
const Contract = require("../model/contract");

const router = express.Router();

// Create Contract
router.post("/", async (req, res) => {
    try {
        const newContract = new Contract(req.body);
        await newContract.save();
        res.status(201).json(newContract);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get All Contracts
router.get("/", async (req, res) => {
    try {
        const contracts = await Contract.find();
        res.status(200).json(contracts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Contract by ID
router.get("/:id", async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ error: "Contract not found" });
        res.status(200).json(contract);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Contract
router.put("/:id", async (req, res) => {
    try {
        const updatedContract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedContract) return res.status(404).json({ error: "Contract not found" });
        res.status(200).json(updatedContract);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Contract
router.delete("/:id", async (req, res) => {
    try {
        const deletedContract = await Contract.findByIdAndDelete(req.params.id);
        if (!deletedContract) return res.status(404).json({ error: "Contract not found" });
        res.status(200).json({ message: "Contract deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
