import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: [3, "Name must be at least 3 characters long"],
    unique: true,
    required: [true, "Name is required"],
  },
  number: {
    type: String,
    minLength: [8, "Number must be at least 8 characters long"],
    validate: {
      validator: (v) => /\d{2,3}-\d+/.test(v),
      message: (_props) => "Number must be a valid phone number",
    },
    required: [true, "Number is required"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "A contact must belong to a owner"],
    immutable: [true, "Changing the owner of a contact is not allowed"],
  },
});

contactSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Contact = mongoose.model("Contact", contactSchema);
