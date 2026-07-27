namespace SmartFM.Domain.Entities;

public static class OrderStatus
{
    public const string Pending = "Pending";
    public const string PendingPayment = "Pending Payment";
    public const string Approved = "Approved";
    public const string Fulfilled = "Fulfilled";
    public const string Cancelled = "Cancelled";
}
