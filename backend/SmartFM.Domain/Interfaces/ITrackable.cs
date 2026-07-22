namespace SmartFM.Domain.Interfaces;

public interface ITrackable
{
    Guid Id { get; }
    string CurrentStatus { get; }
}
