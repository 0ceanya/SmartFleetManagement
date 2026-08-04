# SmartFleetManagement (SmartFM)

- **Backend**: ASP.NET Core 8 Web API (C#), EF Core + SQLite.
- **Frontend**: Next.js (App Router) + MUI + Tailwind + Leaflet.

## Prerequisites

- .NET 8 SDK or C# developer kit (Vscode extensions)
- [Node.js 20+](https://nodejs.org/) and npm
- Git

## First time

git clone https://github.com/0ceanya/SmartFleetManagement.git
cd SmartFleetManagement

cd backend
dotnet build SmartFM.Api/SmartFM.Api.csproj

cd ../frontend
npm install

## > Second time 

# terminal 1
cd backend
dotnet run --project SmartFM.Api
- API: http://localhost:5000/swagger

# terminal 2
cd frontend
npm run dev

- App: http://localhost:3000
