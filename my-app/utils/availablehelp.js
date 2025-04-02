// helpers for hotel room availability

export function findAvailability(schedule, checkIn, checkOut) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return 0;

  let numAvailable = 0;

  for (const roomSched of schedule) {
    let isRoomFree = true;
    const tempDate = new Date(inDate);
    for (let i = 0; i < numDays; i++) {
      const dateStr = tempDate.toISOString().split("T")[0];
      if (!roomSched[dateStr]) {
        isRoomFree = false;
        break;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    if (isRoomFree) {
      numAvailable++;
    }
  }
  return numAvailable;
}

export function findAvailableIndex(schedule, checkIn, checkOut) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return 0;

  let unavailable = -1;
  let count = 0;

  for (const roomSched of schedule) {
    let isRoomFree = true;
    const tempDate = new Date(inDate);
    for (let i = 0; i < numDays; i++) {
      const dateStr = tempDate.toISOString().split("T")[0];
      if (!roomSched[dateStr]) {
        isRoomFree = false;
        break;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    if (isRoomFree) {
      return count;
    }
    count++;
  }
  return unavailable;
}

// copilot lines 66-101
export function isAvailable(schedule, checkIn, checkOut, roomIndex) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return false;

  let isRoomFree = true;
  const tempDate = new Date(inDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = tempDate.toISOString().split("T")[0];
    if (!schedule[roomIndex][dateStr]) {
      isRoomFree = false;
      break;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  return isRoomFree;
}

export function setAvailability(
  schedule,
  checkIn,
  checkOut,
  roomIndex,
  availability
) {
  const inDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Number of nights
  const numDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (numDays <= 0) return false;

  const tempDate = new Date(inDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = tempDate.toISOString().split("T")[0];
    schedule[roomIndex][dateStr] = availability;
    tempDate.setDate(tempDate.getDate() + 1);
  }
}
