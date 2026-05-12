const apiKey = 'edad4dc01db04e2292a04822782dcba8';
const teamId = 65; // Man City

async function test() {
  const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=5`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
