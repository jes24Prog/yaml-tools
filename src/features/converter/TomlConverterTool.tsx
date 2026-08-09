import ConverterTool from "./ConverterTool";
import { tomlToYaml, yamlToToml } from "../../services/converterService";

export default function TomlConverterTool() {
  return (
    <ConverterTool
      icon="convert"
      title="YAML ⇄ TOML"
      description="Convert between YAML and TOML in both directions using smol-toml. Live as you type."
      formatName="TOML"
      toOther={yamlToToml}
      otherToYaml={tomlToYaml}
    />
  );
}
