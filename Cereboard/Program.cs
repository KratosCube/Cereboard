using Cereboard;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var apiBaseUrl = configuration["ApiBaseUrl"];

    HttpClient client;

    if (!string.IsNullOrEmpty(apiBaseUrl))
    {
        client = new HttpClient { BaseAddress = new Uri(apiBaseUrl) };
        Console.WriteLine($"Používám konfigurovanou API adresu: {apiBaseUrl}");
    }
    else
    {
        client = new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) };
        Console.WriteLine($"Používám výchozí adresu: {builder.HostEnvironment.BaseAddress}");
    }

    return client;
});

builder.Services.AddOidcAuthentication(options =>
{
    // Configure your authentication provider options here.
    // For more information, see https://aka.ms/blazor-standalone-auth
    builder.Configuration.Bind("Local", options.ProviderOptions);
});

await builder.Build().RunAsync();
