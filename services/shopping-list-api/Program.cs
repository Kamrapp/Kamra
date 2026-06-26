var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/generate-shopping-list", (GenerateShoppingListRequest request) =>
{
    return Results.Ok(new GenerateShoppingListResponse(
        Items: []
    ));
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

public sealed record GenerateShoppingListRequest(
    IReadOnlyList<DesiredProduct> DesiredProducts,
    HouseholdRequirements? HouseholdRequirements
);

public sealed record DesiredProduct(
    string Name,
    int? Quantity,
    string? Unit
);

public sealed record HouseholdRequirements(
    int? Adults,
    int? Children,
    int? Days,
    string[]? DietaryRestrictions
);

public sealed record GenerateShoppingListResponse(
    IReadOnlyList<ShoppingListItem> Items
);

public sealed record ShoppingListItem(
    string Name,
    decimal Quantity,
    string Unit
);