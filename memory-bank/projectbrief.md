# Project Brief: VCB (Virtual Coloring Book)

## Project Overview
VCB is an AI-powered scratch-off reveal application designed for kids, combining AI image generation with an interactive scratch-off reveal effect where users uncover images by drawing through a white fill layer.

## Core Objectives
1. Provide a simple, kid-friendly interface for generating line art images via AI
2. Enable intuitive scratch-off reveal effect (uncovering images by drawing)
3. Support both AI-generated images and pre-loaded images (e.g., Elsa)
4. Allow users to save and load their work for continuation (future)

## MVP Scope
### Phase 1: Core Features
- **AI Image Generation**: Use @google/genai to generate coloring-ready line art
  - Predefined prompts/categories for easy selection
  - Kid-appropriate content generation
  
- **Scratch-Off Reveal Tools**:
  - Drawing/scratching to reveal original image
  - White fill layer covering inner content
  - Outline-only rendering (outer boundary)
  - Reset button to restore white fill
  - Progress tracking (revealed percentage)

- **Save/Load System**:
  - Save colored images locally
  - Session storage or lightweight cloud storage
  - Load previously saved work

## Target Users
- Primary: Children (ages 4-12)
- Secondary: Parents/guardians supervising

## Success Criteria
- Simple, intuitive interface requiring minimal instruction
- Fast AI image generation (< 10 seconds)
- Responsive coloring experience with no lag
- Reliable save/load functionality

## Out of Scope (Post-MVP)
- Advanced editing tools (layers, filters, effects)
- Social sharing features
- User accounts and authentication
- Gallery/community features
- Print functionality
