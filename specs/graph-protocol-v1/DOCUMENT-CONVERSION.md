# Document Conversion

Below are instructions for converting the markdown specification to a PDF.

1. Download [Pandoc](https://pandoc.org/installing.html)
1. Install [LaTeX](https://www.latex-project.org/) on your machine
1. Navigate to *this folder* in your Terminal
   - Run the following command:
 ```bash
 pandoc -f gfm -H deeplists.tex --resource-path ./architecture-overview -s \
 -o graph-protocol-v1-spec.pdf README.md ./architecture-overview/README.md \
 ./mechanism-design/README.md ./query-processing/README.md ./payment-channels/README.md \
 ./read-interface/README.md ./messages/README.md ./rpc-api/README.md \
 ./datasets/README.md ./data-modeling/README.md ./subgraph-manifest/README.md \
 ./mappings-api/README.md
 ```
