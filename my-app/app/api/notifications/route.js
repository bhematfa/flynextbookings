import { prisma } from "../../../utils/db";
import { NextResponse } from "next/server";


export async function POST(request) {
    const body = await request.json()
    const { message, uid } = body;

    if (!message || typeof message !== "string" || !uid || typeof uid !== "string") {
        return NextResponse.json(
            { error: "Missing or invalid required fields" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
        return NextResponse.json({ "error": "User not found" }, { status: 404 });
    }

    try {
        const notification = await prisma.notification.create({ data: { message: message, user: { connect: { id: uid } } } });
        return NextResponse.json(notification)
    }
    catch (error) {
        return NextResponse.json({ "error": "Creation Error" }, { status: 500 });
    }

}

export async function GET(request) {
    const uid = request.nextUrl.searchParams.get("uid");

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
        return NextResponse.json({ "error": "User not found" }, { status: 404 });
    }

    try {
        const notifications = await prisma.notification.findMany({ where: { userId: uid } });

        const unreadCount = await prisma.notification.count({ where: { userId: uid, isRead: false } });

        return NextResponse.json({
            "notifications": notifications, "unreadCount": unreadCount
        });

    }
    catch (error) {
        return NextResponse.json({ "error": "Processing Error" }, { status: 500 });
    }

}

export async function PATCH(request) {
    try{
    const body = await request.json()
    const { id, isRead } = body;

    // Validation
    if (!id || typeof id !== "string" || typeof isRead !== "boolean") {
        return NextResponse.json(
          { error: "Missing or invalid required fields" },
          { status: 400 }
        );
      }

    // Existance of notification with ID
    const existingNotification = await prisma.notification.findUnique({
        where: { id },
      });
      
    if (!existingNotification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

    //Update
    const updated = await prisma.notification.update(
        {where: {id:id},
        data:{isRead: isRead}}
    )

    return NextResponse.json(updated, { status: 200 });
    }
    catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
}