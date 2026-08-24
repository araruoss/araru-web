import { useQuery } from '@tanstack/react-query';import { fetchJson } from '../lib/api.js';
export function useFeatureFlags(){const query=useQuery({queryKey:['feature-flags'],queryFn:({signal})=>fetchJson('/features',{signal}),staleTime:5*60_000});return{flags:query.data?.data||{},enabled:(name,fallback=false)=>query.data?.data?.[name]?.enabled??fallback};}
