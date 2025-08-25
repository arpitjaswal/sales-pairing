import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Typography,
  Collapse,

  styled,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,

  Videocam as VideocamIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Add as AddIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { User } from '../../contexts/AuthContext';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    borderRight: 'none',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '& .MuiListItemButton-root': {
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5, 2),
    padding: theme.spacing(1, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-selected': {
      backgroundColor: `${theme.palette.primary.main}15`,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.primary.main,
        fontWeight: 500,
      },
    },
  },
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiAvatar-root': {
    width: 40,
    height: 40,
    marginRight: theme.spacing(1.5),
  },
}));

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerClose: () => void;
  handleDrawerTransitionEnd: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth,
  mobileOpen,
  handleDrawerClose,
  handleDrawerTransitionEnd,
  user,
}) => {

  const location = useLocation();
  const navigate = useNavigate();
  const [openSessions, setOpenSessions] = React.useState(true);

  const handleClick = () => {
    setOpenSessions(!openSessions);
  };

  const isActive = (path: string, exact = false) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      exact: true,
    },
    {
      text: 'Sessions',
      icon: <VideocamIcon />,
      path: '/sessions',
      subItems: [
        { text: 'My Sessions', path: '/sessions', icon: <ListIcon /> },
        { text: 'Create Session', path: '/sessions/new', icon: <AddIcon /> },
      ],
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <StyledDrawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <Toolbar />
        <UserInfo>
          <Avatar alt={user?.name || `${user?.firstName} ${user?.lastName}`} src={user?.avatar} />
          <Box>
            <Typography variant="subtitle2" fontWeight={500}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        </UserInfo>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.subItems ? (
                <>
                  <StyledListItem disablePadding>
                    <ListItemButton onClick={handleClick}>
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                      {openSessions ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </StyledListItem>
                  <Collapse in={openSessions} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <StyledListItem key={subItem.path} disablePadding>
                          <ListItemButton
                            selected={isActive(subItem.path, true)}
                            onClick={() => navigate(subItem.path)}
                            sx={{ pl: 6 }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        </StyledListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <StyledListItem key={item.path} disablePadding>
                  <ListItemButton
                    selected={isActive(item.path, item.exact)}
                    onClick={() => navigate(item.path)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </StyledListItem>
              )}
            </React.Fragment>
          ))}
        </List>
        <Divider sx={{ mt: 'auto' }} />
        <List>
          <StyledListItem disablePadding>
            <ListItemButton onClick={() => {}}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </StyledListItem>
        </List>
      </StyledDrawer>
      <StyledDrawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        <Toolbar />
        <UserInfo>
          <Avatar alt={user?.name || `${user?.firstName} ${user?.lastName}`} src={user?.avatar} />
          <Box>
            <Typography variant="subtitle2" fontWeight={500}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        </UserInfo>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.subItems ? (
                <>
                  <StyledListItem disablePadding>
                    <ListItemButton onClick={handleClick}>
                      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                      {openSessions ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </StyledListItem>
                  <Collapse in={openSessions} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <StyledListItem key={subItem.path} disablePadding>
                          <ListItemButton
                            selected={isActive(subItem.path, true)}
                            onClick={() => navigate(subItem.path)}
                            sx={{ pl: 6 }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        </StyledListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <StyledListItem key={item.path} disablePadding>
                  <ListItemButton
                    selected={isActive(item.path, item.exact)}
                    onClick={() => navigate(item.path)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </StyledListItem>
              )}
            </React.Fragment>
          ))}
        </List>
        <Divider sx={{ mt: 'auto' }} />
        <List>
          <StyledListItem disablePadding>
            <ListItemButton onClick={() => {}}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </StyledListItem>
        </List>
      </StyledDrawer>
    </Box>
  );
};

export default Sidebar;
