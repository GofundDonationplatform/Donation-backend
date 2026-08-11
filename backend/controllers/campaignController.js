import Campaign from "../models/Campaign.js";
import cloudinary from "../config/cloudinary.js";

const uploadCampaignImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "gofundss/campaigns",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// Create Campaign
export const createCampaign = async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      const uploaded = await uploadCampaignImage(req.file.buffer);
      imageUrl = uploaded.secure_url;
    }

    const campaign = await Campaign.create({
      ...req.body,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (err) {
    console.error("Create campaign error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get One Campaign
export const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      campaign,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Campaign
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    Object.assign(campaign, req.body);

    if (req.file) {
      const uploaded = await uploadCampaignImage(req.file.buffer);
      campaign.image = uploaded.secure_url;
    }

    const updatedCampaign = await campaign.save();

    res.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (err) {
    console.error("Update campaign error:", err);

    if (err.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Campaign
export const deleteCampaign = async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
