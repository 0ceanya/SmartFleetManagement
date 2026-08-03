hihi

## Manual Swagger check

download dotnet (if use VSCode)
dotnet run --project SmartFM.Api  // check if Telemetry on (if not running, change Telemetry:Enabled to false in appsettings.json or through CLI)

--> 
Telemetry__Enabled=false dotnet run --project backend/SmartFM.Api

then access /swagger ko cx dc
http://localhost:5000/swagger/index.html

## Commands

Run from `backend/`. No `.sln` exists yet, so `dotnet build`/`dotnet test` at the solution level won't work — build/test individual `.csproj` files.

```
dotnet build SmartFM.Api/SmartFM.Api.csproj        # build (pulls in Domain/Application/Infrastructure)
dotnet test SmartFM.Tests/SmartFM.Tests.csproj     # run all tests
dotnet test --filter FullyQualifiedName~MasterDataCoordinatorTests   # single test class
dotnet ef migrations add <Name> -p SmartFM.Infrastructure -s SmartFM.Api  # EF migration
dotnet ef database update -p SmartFM.Infrastructure -s SmartFM.Api        # apply migrations
dotnet run --project SmartFM.Api                  # run the API (migrates, seeds, bootstraps SmartFMSystem, starts telemetry)
```

`dotnet-ef` is not installed globally by default in a fresh environment: `dotnet tool install --global dotnet-ef` first, and if `~/.dotnet/tools` isn't on `PATH`, prefix commands with it for that session.

Swagger UI is served at `/swagger` in the Development environment; the JSON spec is at `/swagger/v1/swagger.json`.

Set `Telemetry:Enabled` to `false` in `appsettings.json` (or `Telemetry__Enabled=false` env var) to stop `TelemetrySimulator`'s 10-second background tick — useful when manually testing fleet/incident state that the simulator would otherwise mutate mid-test (it randomly completes assignments via simulated incidents).


in vscode:
1. install C# developer kit
2. run dotnet run --project backend/SmartFM.Api
3. open another terminal, cd frontend
4. npm install
5. npm run dev
