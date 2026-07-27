import { quotationRequestsAPI } from './src/services/api.js';

async function test() {
    try {
        const reqData = await quotationRequestsAPI.getAll();
        const data = reqData.data || (Array.isArray(reqData) ? reqData : []);
        const statuses = data.map(a => a.status);
        console.log("Unique statuses:", [...new Set(statuses)]);
        console.log("All data:", JSON.stringify(data.slice(0, 3), null, 2));
    } catch(e) {
        console.log(e);
    }
}
test();
