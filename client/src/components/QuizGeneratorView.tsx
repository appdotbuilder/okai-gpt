import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  FileQuestion, 
  Brain, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
  Download
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateQuizInput } from '../../../server/src/schema';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface QuizData {
  quiz: QuizQuestion[];
  title?: string;
  difficulty?: string;
}

export function QuizGeneratorView() {
  const [sourceText, setSourceText] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  const generateQuiz = async () => {
    if (!sourceText.trim()) {
      setError('Please enter some text to generate a quiz from');
      return;
    }

    if (sourceText.trim().length < 100) {
      setError('Please provide more text (at least 100 characters) for better quiz generation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuizData(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setShowAnswers(false);

    try {
      const input: CreateQuizInput = {
        source_text: sourceText.trim()
      };

      const result = await trpc.generateQuiz.mutate(input);
      
      // Parse the quiz data from the result
      const parsedQuizData = result.quiz_data as QuizData;
      setQuizData(parsedQuizData);

    } catch (error) {
      console.error('Quiz generation failed:', error);
      setError('Failed to generate quiz. Please try again with different text.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (quizSubmitted) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
    setShowAnswers(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setShowAnswers(false);
  };

  const getScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    
    const correct = quizData.quiz.reduce((acc, question, index) => {
      return acc + (userAnswers[index] === question.answer ? 1 : 0);
    }, 0);
    
    const total = quizData.quiz.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, total, percentage };
  };

  const downloadQuiz = () => {
    if (!quizData) return;

    const quizText = `
Quiz: ${quizData.title || 'Generated Quiz'}
${quizData.difficulty ? `Difficulty: ${quizData.difficulty}` : ''}
Generated on: ${new Date().toLocaleString()}

${quizData.quiz.map((q, index) => `
Question ${index + 1}: ${q.question}

Options:
${q.options.map((option, optIndex) => `${String.fromCharCode(65 + optIndex)}. ${option}`).join('\n')}

Correct Answer: ${q.answer}
${q.explanation ? `Explanation: ${q.explanation}` : ''}
`).join('\n---\n')}
`;

    const blob = new Blob([quizText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-quiz.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sampleTexts = [
    "The water cycle is the continuous movement of water on, above and below the surface of the Earth. It involves evaporation, condensation, precipitation, and collection. Solar energy drives the water cycle by evaporating water from oceans, lakes, and rivers. This water vapor rises into the atmosphere where it cools and condenses into clouds. When the water droplets in clouds become too heavy, they fall as precipitation in the form of rain, snow, or sleet. This precipitation then flows back into bodies of water or infiltrates into the ground, completing the cycle.",

    "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll. During this process, plants take in carbon dioxide from the air and water from the soil. Using the energy from sunlight, they convert these raw materials into glucose (sugar) and oxygen. The glucose provides energy for the plant's growth and development, while the oxygen is released into the atmosphere as a byproduct. This process is crucial for life on Earth as it produces the oxygen we breathe and forms the base of most food chains.",

    "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. AI systems can perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation. Machine learning, a subset of AI, enables computers to learn and improve their performance without being explicitly programmed. Deep learning, which uses neural networks, has revolutionized AI by enabling breakthroughs in image recognition, natural language processing, and game playing."
  ];

  const score = getScore();

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Brain className="mr-3 text-green-400" size={28} />
              Quiz Generator
            </h1>
            <p className="text-gray-400 mt-1">
              Transform any text into an interactive multiple-choice quiz for learning and assessment
            </p>
          </div>
          
          {quizData && (
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-600">
                {quizData.quiz.length} question{quizData.quiz.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                onClick={downloadQuiz}
                size="sm"
                variant="outline"
                className="border-gray-600 hover:border-green-400"
              >
                <Download size={16} className="mr-1" />
                Export
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {!quizData ? (
          /* Input Section */
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileQuestion className="mr-2 text-amber-400" size={20} />
                  Source Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Paste your text content here
                  </label>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter the text you want to create a quiz from. This could be an article, lesson content, study notes, or any educational material..."
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[300px]"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {sourceText.length} characters
                    </span>
                    <span className="text-xs text-gray-500">
                      Minimum 100 characters recommended
                    </span>
                  </div>
                </div>

                <Button
                  onClick={generateQuiz}
                  disabled={!sourceText.trim() || isGenerating}
                  className="w-full btn-accent"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Brain size={16} className="mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
                    <AlertCircle size={16} className="text-red-400 mr-2 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">📚 Sample Texts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {sampleTexts.map((text, index) => (
                    <button
                      key={index}
                      onClick={() => setSourceText(text)}
                      className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-green-400 transition-all text-gray-300 text-sm w-full"
                      disabled={isGenerating}
                    >
                      <p className="font-medium mb-1">
                        {index === 0 ? 'Water Cycle' : index === 1 ? 'Photosynthesis' : 'Artificial Intelligence'}
                      </p>
                      <p className="line-clamp-3">{text.substring(0, 150)}...</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Quiz Display Section */
          <div className="space-y-6">
            {/* Quiz Header */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">
                      {quizData.title || 'Generated Quiz'}
                    </CardTitle>
                    {quizData.difficulty && (
                      <Badge className="mt-2 bg-blue-600">
                        {quizData.difficulty}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {quizSubmitted && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {score.percentage}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {score.correct}/{score.total} correct
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => setShowAnswers(!showAnswers)}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 hover:border-amber-400"
                    >
                      {showAnswers ? (
                        <>
                          <EyeOff size={16} className="mr-1" />
                          Hide Answers
                        </>
                      ) : (
                        <>
                          <Eye size={16} className="mr-1" />
                          Show Answers
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setQuizData(null);
                        setSourceText('');
                        setError(null);
                      }}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 hover:border-red-400 text-red-400"
                    >
                      New Quiz
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              {quizData.quiz.map((question, questionIndex) => {
                const userAnswer = userAnswers[questionIndex];
                const correctAnswer = question.answer;
                const isCorrect = userAnswer === correctAnswer;
                
                return (
                  <Card key={questionIndex} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-white font-semibold text-lg flex items-start">
                          <span className="bg-gray-700 text-amber-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">
                            {questionIndex + 1}
                          </span>
                          <span>{question.question}</span>
                        </h3>
                        
                        {quizSubmitted && (
                          <div className="flex-shrink-0 ml-3">
                            {isCorrect ? (
                              <CheckCircle size={24} className="text-green-400" />
                            ) : (
                              <XCircle size={24} className="text-red-400" />
                            )}
                          </div>
                        )}
                      </div>

                      <RadioGroup 
                        value={userAnswer || ''} 
                        onValueChange={(value) => handleAnswerChange(questionIndex, value)}
                        disabled={quizSubmitted}
                        className="space-y-3"
                      >
                        {question.options.map((option, optionIndex) => {
                          const optionLetter = String.fromCharCode(65 + optionIndex);
                          const isThisCorrect = option === correctAnswer;
                          const isSelected = userAnswer === option;
                          
                          let optionClass = "flex items-center space-x-3 p-3 rounded-lg border transition-all";
                          
                          if (quizSubmitted) {
                            if (isThisCorrect) {
                              optionClass += " border-green-500 bg-green-900/30";
                            } else if (isSelected && !isThisCorrect) {
                              optionClass += " border-red-500 bg-red-900/30";
                            } else {
                              optionClass += " border-gray-600 bg-gray-700/30";
                            }
                          } else {
                            optionClass += " border-gray-600 hover:border-gray-500 bg-gray-700/50";
                            if (isSelected) {
                              optionClass += " border-amber-400 bg-amber-900/20";
                            }
                          }

                          return (
                            <div key={optionIndex} className={optionClass}>
                              <RadioGroupItem 
                                value={option} 
                                id={`q${questionIndex}-${optionIndex}`}
                                disabled={quizSubmitted}
                              />
                              <Label 
                                htmlFor={`q${questionIndex}-${optionIndex}`}
                                className="flex-1 cursor-pointer text-gray-200 flex items-center"
                              >
                                <span className="font-semibold mr-2 text-gray-400">
                                  {optionLetter}.
                                </span>
                                {option}
                                {showAnswers && isThisCorrect && (
                                  <CheckCircle size={16} className="ml-2 text-green-400" />
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>

                      {showAnswers && question.explanation && (
                        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-blue-300 text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quiz Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4">
                  {!quizSubmitted ? (
                    <Button
                      onClick={submitQuiz}
                      disabled={Object.keys(userAnswers).length !== quizData.quiz.length}
                      className="btn-accent px-8"
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400 mb-1">
                          {score.percentage}%
                        </div>
                        <div className="text-sm text-gray-400">
                          You scored {score.correct} out of {score.total} questions correctly
                        </div>
                      </div>
                      
                      <Button
                        onClick={resetQuiz}
                        variant="outline"
                        className="border-gray-600 hover:border-amber-400"
                      >
                        <RotateCcw size={16} className="mr-1" />
                        Retake Quiz
                      </Button>
                    </div>
                  )}
                </div>

                {!quizSubmitted && Object.keys(userAnswers).length < quizData.quiz.length && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    Answer all questions to submit the quiz
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}