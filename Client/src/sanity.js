import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "z4mjyizc", 
  dataset: "production", 
  useCdn: true, 
  token: import.meta.env.VITE_SANITY_API, 
});

export default client;
