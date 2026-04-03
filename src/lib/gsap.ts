// src/lib/gsap.ts
// This file is imported only from client components ('use client').
// It centralizes GSAP plugin registration so it only happens once.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
