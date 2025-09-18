"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { Trip, Booking } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
  },
  tripInfo: {
    marginBottom: 20,
    border: '1px solid #eee',
    padding: 10,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2',
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    height: 25, // Ensure rows have height
  },
});

const EthiopianReceiptPDF = ({ trip, bookings }: { trip: Trip, bookings: (Booking | { seat_number: number, passenger_name: string, passenger_phone: string })[] }) => {
  const totalSeats = trip.buses.total_seats || 51;
  const passengers = Array.from({ length: totalSeats }, (_, i) => {
    const seatNumber = i + 1;
    const booking = bookings.find(b => b.seat_number === seatNumber);
    return booking || { seat_number: seatNumber, passenger_name: '', passenger_phone: '' };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>የጉዞ ደረሰኝ</Text>
          <Text style={styles.subtitle}>Felege Giyon Express</Text>
        </View>
        <View style={styles.tripInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>መድረሻ:</Text>
            <Text>{trip.destination}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>የጉዞ ቀን:</Text>
            <Text>{new Date(trip.departure_time).toLocaleDateString('am-ET')}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColHeader, { width: '10%' }]}>ተ.ቁ.</Text>
            <Text style={[styles.tableColHeader, { width: '40%' }]}>የተሳፋሪው ስም</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>ስልክ ቁጥር</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>ፊርማ</Text>
          </View>
          {passengers.map((passenger, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCol}>{passenger.seat_number}</Text>
              <Text style={styles.tableCol}>{passenger.passenger_name}</Text>
              <Text style={styles.tableCol}>{passenger.passenger_phone}</Text>
              <Text style={styles.tableCol}></Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default EthiopianReceiptPDF;
