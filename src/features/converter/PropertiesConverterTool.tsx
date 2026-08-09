import ConverterTool from "./ConverterTool";
import { propertiesToYaml, yamlToProperties } from "../../services/converterService";

export default function PropertiesConverterTool() {
  return (
    <ConverterTool
      icon="convert"
      title="YAML ⇄ Properties"
      description="Convert between YAML and Java-style .properties files. Nested keys are flattened to dotted notation."
      formatName="Properties"
      toOther={yamlToProperties}
      otherToYaml={propertiesToYaml}
    />
  );
}
