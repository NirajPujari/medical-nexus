import { NextResponse } from "next/server";
import {getDatabase} from "@api/utils/mongo";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("doctor");
    const data = await collection.find({}).toArray();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch doctors",error }, { status: 500 });
  }
}
