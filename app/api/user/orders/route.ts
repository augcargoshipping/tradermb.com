import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use the airtableService instance to get user orders
    const orders = await airtableService.getUserOrders(userId);

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch user orders" },
      { status: 500 }
    );
  }
} 