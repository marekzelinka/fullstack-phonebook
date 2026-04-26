import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

personSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Person = mongoose.model("Person", personSchema);
