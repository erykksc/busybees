// Parse command line arguments
const args = process.argv.slice(2);
export const getArgValue = (argName: string, defaultVal?: string): string => {
  const index = args.indexOf(`--${argName}`);
  if (index === -1 || index + 1 >= args.length) {
    if (!defaultVal) {
      throw new Error(`Missing required argument: --${argName}`);
    }
    return defaultVal;
  }
  return args[index + 1];
};

export const defaultUsername = "user@example.com";
export const defaultPassword = "Passw0rd!";
