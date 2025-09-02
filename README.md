# Likho - Realistic Computer-Generated Handwriting

A Next.js application that converts text to realistic handwriting using an in-browser recurrent neural network. Choose from various print and cursive styles, customize the outputs, and download as SVG.

## Features

- **Realistic Handwriting Generation**: Uses a neural network model to generate natural-looking handwriting
- **Multiple Styles**: Choose from 9 different handwriting styles
- **Customizable Parameters**: 
  - Speed: Control the writing speed
  - Legibility: Adjust how clear the handwriting appears
  - Stroke Width: Modify the thickness of the pen strokes
- **SVG Export**: Download your generated handwriting as scalable vector graphics
- **Real-time Generation**: Watch as your text is converted to handwriting in real-time

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Eeman1113/likho.git
cd likho
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. Enter your text in the input field at the bottom (max 50 characters)
2. Adjust the parameters using the sliders:
   - **Speed**: Controls how fast the handwriting appears
   - **Legibility**: Higher values make text more readable
   - **Stroke Width**: Adjusts pen thickness
3. Select a handwriting style from the dropdown (1-9)
4. Click "Write!" to generate the handwriting
5. Click the download button (appears after generation) to save as SVG

## Technical Details

- **Framework**: Next.js 15 with TypeScript
- **Neural Network**: Recurrent neural network for handwriting synthesis
- **Model**: Binary model file (`d.bin`) containing pre-trained weights
- **Rendering**: SVG-based path generation for scalable output

## Model Information

The application uses a pre-trained neural network model stored in `public/d.bin`. This model contains the weights and parameters necessary for generating realistic handwriting patterns.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Original Concept

This is a Next.js conversion of the original Calligrapher.ai handwriting generation system, maintaining the core neural network logic while modernizing the frontend architecture.

