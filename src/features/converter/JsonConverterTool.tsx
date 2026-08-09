import ConverterTool from "./ConverterTool";
import { jsonToYaml, yamlToJson } from "../../services/converterService";

export default function JsonConverterTool() {
  return (
    <ConverterTool
      icon="convert"
      title="YAML ⇄ JSON"
      description="Convert between YAML and JSON in both directions. Conversion happens live as you type."
      formatName="JSON"
      toOther={(source) => yamlToJson(source, true)}
      otherToYaml={jsonToYaml}
    />
  );
}
