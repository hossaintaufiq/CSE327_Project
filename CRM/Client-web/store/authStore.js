import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      companies: [],
      activeCompanyId: null,
      activeCompanyRole: null,
      idToken: null,

      setUser: (user) => {
        set({ user });
        // Update companies from user data
        if (user?.companies) {
          set({ companies: user.companies });
          
          // Check localStorage for previously selected company
          let storedCompanyId = null;
          if (typeof window !== 'undefined') {
            storedCompanyId = localStorage.getItem('companyId');
          }
          
          // Set active company: prefer stored companyId, then first active, then first company
          if (user.companies.length > 0) {
            let companyToSet = null;
            
            // First, try to use stored companyId
            if (storedCompanyId) {
              companyToSet = user.companies.find((c) => c.companyId === storedCompanyId);
            }
            
            // If not found, use first active company
            if (!companyToSet) {
              companyToSet = user.companies.find((c) => c.isActive);
            }
            
            // If still not found, use first company
            if (!companyToSet) {
              companyToSet = user.companies[0];
            }
            
            // Only set if we don't already have an active company or if it's different
            if (companyToSet && (!get().activeCompanyId || get().activeCompanyId !== companyToSet.companyId)) {
              set({
                activeCompanyId: companyToSet.companyId,
                activeCompanyRole: companyToSet.role,
              });
              // Update localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('companyId', companyToSet.companyId);
              }
            }
          }
        }
      },

      setCompanies: (companies) => set({ companies }),

      setActiveCompany: (companyId, role) => {
        set({ activeCompanyId: companyId, activeCompanyRole: role });
        // Update localStorage for API interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('companyId', companyId);
        }
      },

      setIdToken: (token) => {
        set({ idToken: token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('idToken', token);
        }
      },

      logout: () => {
        set({
          user: null,
          companies: [],
          activeCompanyId: null,
          activeCompanyRole: null,
          idToken: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('idToken');
          localStorage.removeItem('user');
          localStorage.removeItem('companyId');
        }
      },

      isSuperAdmin: () => {
        return get().user?.globalRole === 'super_admin';
      },

      hasCompany: () => {
        return get().companies?.length > 0;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        companies: state.companies,
        activeCompanyId: state.activeCompanyId,
        activeCompanyRole: state.activeCompanyRole,
      }),
    }
  )
);

export default useAuthStore;

