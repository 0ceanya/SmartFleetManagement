import OrderDetailView from "./OrderDetailView";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <OrderDetailView id={id} />;
}
