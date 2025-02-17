const Contract = require('../model/contract');
const { User } = require('../model/User');

// Create a new contract
exports.createContract = async (req, res) => {
    try {
        const userId=req.user;
        req.body.user=userId;
        console.log('cont',req.body)
        const contract = new Contract(req.body);
        await contract.save();
        res.status(201).json(contract);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all contracts
exports.getAllContracts = async (req, res) => {
    try {
        const user = await User.findOne({_id:req.user});
        const contracts = await Contract.find({
            is_deleted: false,
            $or: [
              { user: req.user }, // Match by user ID
              { email: user.email } // Match by email
            ]
          }).populate('user');
                  res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single contract by ID
exports.getContractById = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id).populate('user');
        if (!contract || contract.is_deleted) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a contract
exports.updateContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contract || contract.is_deleted) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a contract (soft delete)
exports.deleteContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndUpdate(req.params.id, { is_deleted: true }, { new: true });
        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json({ message: 'Contract deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Payment Milestone to a contract
exports.addPaymentMilestone = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.contractId);
        if (!contract || contract.is_deleted) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        contract.paymentMilestone.push(req.body);
        await contract.save();
        res.status(200).json(contract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Payment Milestones of a contract
exports.getPaymentMilestones = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.contractId);
        if (!contract || contract.is_deleted) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract.paymentMilestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.addTimeline = async (req, res) => {
    const { contractId } = req.params;
    const { startDate, endDate, timelineName } = req.body;

    if (!startDate || !endDate || !timelineName) {
        return res.status(400).json({ message: 'All timeline fields are required.' });
    }

    try {
        const contract = await Contract.findById(contractId);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found.' });
        }

        contract.timeline.push({ startDate, endDate, timelineName });
        contract.lastUpdate = Date.now();

        await contract.save();

        res.status(200).json({ message: 'Timeline added successfully.', contract });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};


exports.getTimeline = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.contractId);
        if (!contract || contract.is_deleted) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.status(200).json(contract.timeline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.addPaymentMilestone = async (req, res) => {
    const { contractId } = req.params; 
    const { milestoneName, desc, amount, startDate, endDate, status } = req.body;
  
    try {
      if (!milestoneName || !desc || !amount || !startDate || !endDate || !status) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
  
      const newMilestone = {
        milestoneName,
        desc,
        amount,
        startDate,
        endDate,
        status
      };
  
      contract.paymentMilestone.push(newMilestone);
  
      const updatedContract = await contract.save();
  
      return res.status(200).json(updatedContract);
    } catch (error) {
      console.error("Error adding payment milestone:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
  


  exports.getVersionsByContract = async (req,res)=>{
    try{
        const versions = await Contract.findById(req.params.contractId).select("version");
        if(!versions){
            return res.status(404).json({message:'No versions found for this Contract'});

        }
        return res.status(200).json({message:'fetched versions for the contract',versions});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Error fetching versions" , message:err.message})
    }
  }


  exports.updateMilestoneStatus = async (req, res) => {
    try {
        const { contractId, milestoneId } = req.params; // Get IDs from request params
        const { status } = req.body; // Get status from request body

        // Validate status input
        const validStatuses = ["completed", "pending", "inprogress"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Find the contract by ID
        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        // Find the specific milestone by ID
        const milestone = contract.paymentMilestone.id(milestoneId);
        if (!milestone) {
            return res.status(404).json({ message: "Payment milestone not found" });
        }

        // Update milestone status
        milestone.status = status;
        await contract.save(); // Save the updated contract

        return res.status(200).json({
            message: "Payment milestone status updated successfully",
            updatedMilestone: milestone,
        });
    } catch (error) {
        console.error("Error updating milestone status:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};