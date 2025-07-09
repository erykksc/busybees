{
  description = "A Nix-flake for the Busy-Bees development environment";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1";

  outputs =
    inputs:
    let
      nodejsVersion = 22;

      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSupportedSystem =
        f:
        inputs.nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            pkgs = import inputs.nixpkgs {
              inherit system;
              overlays = [ inputs.self.overlays.default ];
            };
            system = system;
          }
        );
    in
    {
      overlays.default = final: prev: {
        nodejs = final."nodejs_${toString nodejsVersion}";
      };

      # ➡️ new: package environment
      packages = forEachSupportedSystem (
        { pkgs, system }:
        {
          devEnv = pkgs.buildEnv {
            name = "busy-bees-dev-env";
            paths = [
              pkgs.awscli2
              pkgs.nixfmt-rfc-style
              pkgs.nodejs
              pkgs.nodePackages.vercel
            ];
          };
        }
      );

      devShells = forEachSupportedSystem (
        { pkgs, system }:
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              inputs.self.packages.${system}.devEnv
            ];
          };
        }
      );
    };
}
