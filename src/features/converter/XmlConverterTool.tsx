import ConverterTool from "./ConverterTool";
import { xmlToYaml, yamlToXml } from "../../services/converterService";

export default function XmlConverterTool() {
  return (
    <ConverterTool
      icon="convert"
      title="YAML ⇄ XML"
      description="Convert between YAML and XML using fast-xml-parser. Keys prefixed with @ become XML attributes."
      formatName="XML"
      toOther={yamlToXml}
      otherToYaml={xmlToYaml}
    />
  );
}
