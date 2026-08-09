import ConverterTool from "./ConverterTool";
import { envToYaml, yamlToEnv } from "../../services/converterService";

export default function EnvConverterTool() {
  return (
    <ConverterTool
      icon="env"
      title="YAML ⇄ .env"
      description="Convert YAML maps to flat KEY=VALUE env files and back. Dotted keys reconstruct nesting when going back to YAML."
      formatName=".env"
      toOther={yamlToEnv}
      otherToYaml={envToYaml}
    />
  );
}
