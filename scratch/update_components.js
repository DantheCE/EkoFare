const fs = require('fs');
const path = require('path');
const pagesDir = 'apps/web/src/app/pages';
const files = [
  'HomeMobile.tsx', 'desktop/HomeDesktop.tsx',
  'RouteListMobile.tsx', 'desktop/RouteListDesktop.tsx',
  'RouteDetailMobile.tsx', 'desktop/RouteDetailDesktop.tsx',
  'FareSummaryMobile.tsx', 'desktop/FareSummaryDesktop.tsx',
  'SavedMobile.tsx', 'desktop/SavedDesktop.tsx',
  'ContributeMobile.tsx', 'desktop/ContributeDesktop.tsx',
  'PendingContributionsMobile.tsx', 'desktop/PendingContributionsDesktop.tsx'
];

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  const componentName = file.split('/').pop().replace('.tsx', '');
  
  if (!code.includes('DevProps')) {
    code = code.replace(
      new RegExp('export default function ' + componentName + '\\(\\) \\{'),
      'export interface DevProps { isLoading?: boolean; isError?: boolean; isEmpty?: boolean; isSuccess?: boolean; isDisabled?: boolean; }\n' +
      'export default function ' + componentName + '({ isLoading: forceLoading, isError: forceError, isEmpty: forceEmpty, isSuccess: forceSuccess, isDisabled: forceDisabled }: DevProps = {}) {'
    );
  }

  // Handle Home
  code = code.replace(/const \{ data: routes, isLoading \} = useRoutes\(activeFilter\);/, 
    'const { data: routesQuery, isLoading: queryLoading } = useRoutes(activeFilter);\n  const isLoading = forceLoading ?? queryLoading;\n  const routes = forceEmpty ? [] : routesQuery;');
  
  // Handle RouteList
  code = code.replace(/const \{ data: routes, isLoading, isError, refetch \} = useRoutes\(\n    activeFilter,\n    debouncedSearch\n  \);/,
    'const { data: routesQuery, isLoading: queryLoading, isError: queryError, refetch } = useRoutes(activeFilter, debouncedSearch);\n  const isLoading = forceLoading ?? queryLoading;\n  const isError = forceError ?? queryError;\n  const routes = forceEmpty ? [] : routesQuery;');
    
  // Handle RouteDetail
  code = code.replace(/const \{ data: route, isLoading \} = useRoute\(id\);/,
    'const { data: routeQuery, isLoading: queryLoading } = useRoute(id);\n  const isLoading = forceLoading ?? queryLoading;\n  const route = forceEmpty ? null : routeQuery;');

  // Handle FareSummary
  code = code.replace(/const \{ data: route, isLoading \} = useRoute\(id\);/,
    'const { data: routeQuery, isLoading: queryLoading } = useRoute(id);\n  const isLoading = forceLoading ?? queryLoading;\n  const route = forceEmpty ? null : routeQuery;');
  
  // Handle Pending
  code = code.replace(/const \{ data: contributions = \[\], isLoading \} = useContributions\("pending"\);/,
    'const { data: queryContribs = [], isLoading: queryLoading } = useContributions("pending");\n  const isLoading = forceLoading ?? queryLoading;\n  const contributions = forceEmpty ? [] : queryContribs;');
    
  fs.writeFileSync(filePath, code);
  console.log('Processed', file);
});
