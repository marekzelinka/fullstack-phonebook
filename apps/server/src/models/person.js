import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
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
      message: (_props) => "Number muse be a valid phone number",
    },
    required: [true, "Number is required"],
  },
});

personSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Person = mongoose.model("Person", personSchema);
