import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function reviewCode(code: string, filePath: string) {
  try {
    const response = await hf.textGeneration({
      model: "deepseek-ai/deepseek-coder-6.7b-base",
      inputs: `你是一个专业的代码审查员。请对提供的代码进行审查，重点关注：
1. 代码质量
2. 潜在的bug
3. 性能问题
4. 安全隐患
5. 代码风格
6. 最佳实践

请按照以下格式输出审查结果：
1. 代码质量评分（1-10分）
2. 主要问题列表
3. 改进建议
4. 总结

代码文件：${filePath}
代码内容：
${code}`,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
      },
    });

    return response.generated_text;
  } catch (error) {
    console.error("代码审查错误:", error);
    throw error;
  }
}
