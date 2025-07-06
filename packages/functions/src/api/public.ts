export async function main() {
  console.log("Public function called");
  return {
    statusCode: 200,
    body: "Hello stranger!",
  };
}
