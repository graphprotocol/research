# The Graph Whitepaper [Deprecated]

See the [v1 protocol specification](../../specs/graph-protocol-v1/README.md) for the latest protocol design.

## Install MacTeX / TeX Live

```sh
brew cask install mactex
```

After this, log in to a fresh shell to make sure all TeX Live commands are
available in your `$PATH`.

## Build PDF

```sh
pdflatex the-graph-whitepaper
```

## Fonts

A list of font packages that are available in TeXlive out of the box is available
here: https://tex.stackexchange.com/questions/59403/what-font-packages-are-installed-in-tex-live

To use any of these, you'd typically add
```latex
\usepackage{gentium}
```
to the header section of `the-graph-whitepaper.tex`, however, oftentimes the
documentation of the packages describe additional parameters that are worth paying
attention to.

These are typically found by going to the package on CTAN and following
`Package Documentation` link under `Documentation`. See
https://ctan.org/pkg/psnfss for an example.
