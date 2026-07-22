import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { saathiGuideApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function GuideManagementPage() {
  const [tabValue, setTabValue] = useState(0);
  const [bestPractices, setBestPractices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [openBpModal, setOpenBpModal] = useState(false);
  const [openActModal, setOpenActModal] = useState(false);
  const [openFaqModal, setOpenFaqModal] = useState(false);

  // Form states
  const [currentBp, setCurrentBp] = useState<any>(null);
  const [currentAct, setCurrentAct] = useState<any>(null);
  const [currentFaq, setCurrentFaq] = useState<any>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bpData, actData, faqData] = await Promise.all([
        saathiGuideApi.getBestPractices(),
        saathiGuideApi.getActivities(),
        saathiGuideApi.getFaqs(),
      ]);
      setBestPractices(bpData);
      setActivities(actData);
      setFaqs(faqData);
    } catch (err) {
      console.error('Failed to load guide data', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- BEST PRACTICES ---
  const handleSaveBp = async () => {
    try {
      if (currentBp.id) {
        await saathiGuideApi.updateBestPractice(currentBp.id, currentBp);
        showMessage('Best Practice updated');
      } else {
        await saathiGuideApi.createBestPractice(currentBp);
        showMessage('Best Practice created');
      }
      setOpenBpModal(false);
      fetchData();
    } catch (err) {
      showMessage('Error saving Best Practice', 'error');
    }
  };

  const handleDeleteBp = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await saathiGuideApi.deleteBestPractice(id);
      showMessage('Best Practice deleted');
      fetchData();
    } catch (err) {
      showMessage('Error deleting Best Practice', 'error');
    }
  };

  // --- ACTIVITIES ---
  const handleSaveAct = async () => {
    try {
      if (currentAct.id) {
        await saathiGuideApi.updateActivity(currentAct.id, currentAct);
        showMessage('Activity updated');
      } else {
        await saathiGuideApi.createActivity(currentAct);
        showMessage('Activity created');
      }
      setOpenActModal(false);
      fetchData();
    } catch (err) {
      showMessage('Error saving Activity', 'error');
    }
  };

  const handleDeleteAct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await saathiGuideApi.deleteActivity(id);
      showMessage('Activity deleted');
      fetchData();
    } catch (err) {
      showMessage('Error deleting Activity', 'error');
    }
  };

  // --- FAQS ---
  const handleSaveFaq = async () => {
    try {
      if (currentFaq.id) {
        await saathiGuideApi.updateFaq(currentFaq.id, currentFaq);
        showMessage('FAQ updated');
      } else {
        await saathiGuideApi.createFaq(currentFaq);
        showMessage('FAQ created');
      }
      setOpenFaqModal(false);
      fetchData();
    } catch (err) {
      showMessage('Error saving FAQ', 'error');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await saathiGuideApi.deleteFaq(id);
      showMessage('FAQ deleted');
      fetchData();
    } catch (err) {
      showMessage('Error deleting FAQ', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Saathi Guide Management</Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
            <Tab label="Best Practices" />
            <Tab label="Suggested Activities" />
            <Tab label="FAQs" />
          </Tabs>
        </Box>

        {/* BEST PRACTICES TAB */}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentBp({ title: '', description: '', icon: 'heart-outline', points: [], sortOrder: 0, isActive: true });
                setOpenBpModal(true);
              }}
            >
              Add Best Practice
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bestPractices.map((bp) => (
                  <TableRow key={bp.id}>
                    <TableCell>{bp.sortOrder}</TableCell>
                    <TableCell>{bp.title}</TableCell>
                    <TableCell>{bp.description}</TableCell>
                    <TableCell>{bp.isActive ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => { setCurrentBp(bp); setOpenBpModal(true); }}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDeleteBp(bp.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {bestPractices.length === 0 && (
                  <TableRow><TableCell colSpan={5}>No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        {/* ACTIVITIES TAB */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentAct({ title: '', duration: '', difficulty: 'Easy', sortOrder: 0, isActive: true });
                setOpenActModal(true);
              }}
            >
              Add Activity
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell>{act.sortOrder}</TableCell>
                    <TableCell>{act.title}</TableCell>
                    <TableCell>{act.duration}</TableCell>
                    <TableCell>{act.difficulty}</TableCell>
                    <TableCell>{act.isActive ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => { setCurrentAct(act); setOpenActModal(true); }}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDeleteAct(act.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow><TableCell colSpan={6}>No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        {/* FAQS TAB */}
        <CustomTabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentFaq({ question: '', answer: '', sortOrder: 0, isActive: true });
                setOpenFaqModal(true);
              }}
            >
              Add FAQ
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>{faq.sortOrder}</TableCell>
                    <TableCell>{faq.question}</TableCell>
                    <TableCell>{faq.isActive ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => { setCurrentFaq(faq); setOpenFaqModal(true); }}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDeleteFaq(faq.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {faqs.length === 0 && (
                  <TableRow><TableCell colSpan={4}>No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>
      </Paper>

      {/* MODALS */}
      
      {/* Best Practice Modal */}
      <Dialog open={openBpModal} onClose={() => setOpenBpModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentBp?.id ? 'Edit Best Practice' : 'Add Best Practice'}</DialogTitle>
        <DialogContent dividers>
          {currentBp && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" value={currentBp.title} onChange={e => setCurrentBp({ ...currentBp, title: e.target.value })} fullWidth />
              <TextField label="Description" value={currentBp.description} onChange={e => setCurrentBp({ ...currentBp, description: e.target.value })} fullWidth multiline rows={2} />
              <TextField label="Icon Name (Ionicons)" value={currentBp.icon} onChange={e => setCurrentBp({ ...currentBp, icon: e.target.value })} fullWidth />
              <TextField 
                label="Points (one per line)" 
                value={Array.isArray(currentBp.points) ? currentBp.points.join('\n') : currentBp.points} 
                onChange={e => setCurrentBp({ ...currentBp, points: e.target.value.split('\n') })} 
                fullWidth multiline rows={4} 
              />
              <TextField type="number" label="Sort Order" value={currentBp.sortOrder} onChange={e => setCurrentBp({ ...currentBp, sortOrder: e.target.value })} fullWidth />
              <FormControlLabel control={<Switch checked={currentBp.isActive} onChange={e => setCurrentBp({ ...currentBp, isActive: e.target.checked })} />} label="Active" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBpModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBp}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={openActModal} onClose={() => setOpenActModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentAct?.id ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
        <DialogContent dividers>
          {currentAct && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" value={currentAct.title} onChange={e => setCurrentAct({ ...currentAct, title: e.target.value })} fullWidth />
              <TextField label="Duration (e.g. 1-2 hours)" value={currentAct.duration} onChange={e => setCurrentAct({ ...currentAct, duration: e.target.value })} fullWidth />
              <TextField label="Difficulty" value={currentAct.difficulty} onChange={e => setCurrentAct({ ...currentAct, difficulty: e.target.value })} fullWidth />
              <TextField type="number" label="Sort Order" value={currentAct.sortOrder} onChange={e => setCurrentAct({ ...currentAct, sortOrder: e.target.value })} fullWidth />
              <FormControlLabel control={<Switch checked={currentAct.isActive} onChange={e => setCurrentAct({ ...currentAct, isActive: e.target.checked })} />} label="Active" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAct}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* FAQ Modal */}
      <Dialog open={openFaqModal} onClose={() => setOpenFaqModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentFaq?.id ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        <DialogContent dividers>
          {currentFaq && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Question" value={currentFaq.question} onChange={e => setCurrentFaq({ ...currentFaq, question: e.target.value })} fullWidth multiline />
              <TextField label="Answer" value={currentFaq.answer} onChange={e => setCurrentFaq({ ...currentFaq, answer: e.target.value })} fullWidth multiline rows={3} />
              <TextField type="number" label="Sort Order" value={currentFaq.sortOrder} onChange={e => setCurrentFaq({ ...currentFaq, sortOrder: e.target.value })} fullWidth />
              <FormControlLabel control={<Switch checked={currentFaq.isActive} onChange={e => setCurrentFaq({ ...currentFaq, isActive: e.target.checked })} />} label="Active" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFaqModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFaq}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity as any} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
