import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // fetch booking to know trip_id and seat_number
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, trip_id, seat_number')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      console.error('Booking fetch error', fetchErr);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // delete booking
    const { error: delErr } = await supabase.from('bookings').delete().eq('id', id);
    if (delErr) {
      console.error('Error deleting booking', delErr);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    // remove seat reservation entries for that trip + seat
    const { error: seatErr } = await supabase
      .from('seat_reservations')
      .delete()
      .match({ trip_id: booking.trip_id, seat_number: booking.seat_number });

    if (seatErr) {
      console.error('Error deleting seat reservation', seatErr);
      // continue even if seat reservation deletion fails
    }

    // log activity
    try {
      await supabase.rpc('log_activity', {
        p_action: 'booking_cancelled',
        p_details: { booking_id: id, seat_number: booking.seat_number },
        p_trip_id: booking.trip_id,
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cancel booking route', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
