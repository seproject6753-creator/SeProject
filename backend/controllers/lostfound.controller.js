const LostFound = require("../models/lostfound.model");
const ApiResponse = require("../utils/ApiResponse");

const listItems = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type) query.type = type;
    const items = await LostFound.find(query).sort({ createdAt: -1 }).lean();
    if (!items || items.length === 0) {
      return ApiResponse.notFound("No items found").send(res);
    }
    return ApiResponse.success(items, "Items loaded").send(res);
  } catch (error) {
    console.error("listItems error", error);
    return ApiResponse.internalServerError(error.message).send(res);
  }
};

const createItem = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      contactName,
      contactPhone,
      contactEmail,
      location,
    } = req.body;

    if (!type || !title || !description) {
      return ApiResponse.badRequest("type, title and description are required").send(res);
    }

    const doc = await LostFound.create({
      type,
      title,
      description,
      contactName,
      contactPhone,
      contactEmail,
      location,
      photo: req.file ? req.file.filename : undefined,
      uploaderId: req.userId,
      status: "open",
    });
    return ApiResponse.created(doc, "Item added").send(res);
  } catch (error) {
    console.error("createItem error", error);
    return ApiResponse.internalServerError(error.message).send(res);
  }
};

const claimItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);
    if (!item) return ApiResponse.notFound("Item not found").send(res);

    if (String(item.uploaderId) !== String(req.userId)) {
      return ApiResponse.forbidden("Only the uploader can mark claimed").send(res);
    }

    if (item.status === "claimed") {
      return ApiResponse.badRequest("Item already claimed").send(res);
    }

    const CLAIM_RETENTION_DAYS = 7;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CLAIM_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    item.status = "claimed";
    item.claimedAt = now;
    item.expiresAt = expiresAt;
    await item.save();
    return ApiResponse.success(item, "Item marked as claimed").send(res);
  } catch (error) {
    console.error("claimItem error", error);
    return ApiResponse.internalServerError(error.message).send(res);
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);
    if (!item) return ApiResponse.notFound("Item not found").send(res);
    if (String(item.uploaderId) !== String(req.userId)) {
      return ApiResponse.forbidden("Only the uploader can delete this item").send(res);
    }
    await LostFound.findByIdAndDelete(id);
    return ApiResponse.success(null, "Item deleted").send(res);
  } catch (error) {
    console.error("deleteItem error", error);
    return ApiResponse.internalServerError(error.message).send(res);
  }
};

module.exports = { listItems, createItem, claimItem, deleteItem };
