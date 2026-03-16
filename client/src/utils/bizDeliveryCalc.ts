import { DELIVERY_APPS, type DeliveryAppFee } from "@/data/bizConstants";

export interface DeliveryFeeResult {
  appName: string;
  appKey: string;
  color: string;
  orderAmount: number;
  monthlyOrders: number;
  commission: number;
  paymentFee: number;
  deliveryFee: number;
  totalFee: number;
  netRevenue: number;
  feeRate: number;
}

export function calcDeliveryFees(
  orderAmount: number,
  monthlyOrders: number,
  apps: DeliveryAppFee[] = DELIVERY_APPS,
): DeliveryFeeResult[] {
  return apps.map((app) => {
    const commission = orderAmount * app.commissionRate * monthlyOrders;
    const paymentFee = orderAmount * app.paymentFeeRate * monthlyOrders;
    const deliveryFee = app.avgDeliveryFee * monthlyOrders;
    const totalFee = commission + paymentFee + deliveryFee;
    const totalRevenue = orderAmount * monthlyOrders;
    const netRevenue = totalRevenue - totalFee;
    const feeRate = totalRevenue > 0 ? totalFee / totalRevenue : 0;

    return {
      appName: app.name,
      appKey: app.key,
      color: app.color,
      orderAmount,
      monthlyOrders,
      commission,
      paymentFee,
      deliveryFee,
      totalFee,
      netRevenue,
      feeRate,
    };
  });
}
