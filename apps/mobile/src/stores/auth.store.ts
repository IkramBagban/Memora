import { create } from 'zustand';
import { type Session, type User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let hasAuthListener = false;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      set({
        isInitialized: true,
        session: data.session,
        user: data.session?.user ?? null,
      });

      if (!hasAuthListener) {
        supabase.auth.onAuthStateChange((_event, nextSession) => {
          set({
            session: nextSession,
            user: nextSession?.user ?? null,
          });
        });

        hasAuthListener = true;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      set({
        session: data.session,
        user: data.user,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw error;
      }

      set({
        session: data.session,
        user: data.user ?? null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      set({ user: null, session: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
