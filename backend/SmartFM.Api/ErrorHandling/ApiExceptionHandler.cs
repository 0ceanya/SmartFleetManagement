using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SmartFM.Api.ErrorHandling;

public class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title) = MapException(exception);

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = exception.Message,
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }

    private static (int StatusCode, string Title) MapException(Exception exception) => exception switch
    {
        ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
        InvalidOperationException ex when ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
            => (StatusCodes.Status404NotFound, "Not Found"),
        InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
        _ => (StatusCodes.Status500InternalServerError, "Internal Server Error")
    };
}
